// Lab B — blocking await (SCOPE.md 3.1). Standard library and JDK only: no libraryDependencies.
//
// One JVM per arm, because a frozen pool never recovers (facts F7). Three pools live here and must not
// be confused: the server's own cached pool, the arm's pool, and the client's own executor. Only the
// arm's pool is ever meant to freeze.

import com.sun.net.httpserver.{HttpExchange, HttpServer}
import java.net.http.{HttpClient, HttpRequest, HttpResponse, HttpTimeoutException}
import java.net.{InetSocketAddress, URI}
import java.nio.charset.StandardCharsets.UTF_8
import java.time.Duration as JavaDuration
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.{CountDownLatch, ExecutorService, Executors}
import scala.concurrent.duration.{Duration, SECONDS}
import scala.concurrent.{Await, ExecutionContext, Future}

val Arms = List("fixed-await", "global-await", "global-noextra", "fixed-compose")

/** What `/work` asks for: `n * 2`, on the arm's pool. */
trait Service {
  def work(n: Int): Future[Int]
  def shutdown(): Unit
}

/** `fixed-await`: a fixed pool of 3, blocking on work that needs the same pool. */
final class AwaitOnFixedPool extends Service {
  private val executor: ExecutorService = Executors.newFixedThreadPool(3)
  private val pool: ExecutionContext = ExecutionContext.fromExecutor(executor)
  def work(n: Int): Future[Int] = Future { Await.result(Future(n * 2)(pool), Duration.Inf) }(pool)
  def shutdown(): Unit = { executor.shutdownNow(); () }
}

/**
 * `global-await` and `global-noextra`: the same code on the global pool. The two arms differ only by
 * the three `-Dscala.concurrent.context.*` options the runner passes to the JVM (SCOPE.md 3.1).
 */
final class AwaitOnGlobalPool extends Service {
  private val pool: ExecutionContext = ExecutionContext.global
  def work(n: Int): Future[Int] = Future { Await.result(Future(n * 2)(pool), Duration.Inf) }(pool)
  def shutdown(): Unit = ()
}

/** `fixed-compose`: the same fixed pool of 3, composing instead of blocking. */
final class ComposeOnFixedPool extends Service {
  private val executor: ExecutorService = Executors.newFixedThreadPool(3)
  private val pool: ExecutionContext = ExecutionContext.fromExecutor(executor)
  def work(n: Int): Future[Int] = Future(n)(pool).flatMap(x => Future(x * 2)(pool))(pool)
  def shutdown(): Unit = { executor.shutdownNow(); () }
}

/** A JSON object with the keys in the order SCOPE.md 3.1 writes them. */
def json(pairs: (String, Any)*): String =
  pairs
    .map { case (key, value) =>
      val rendered = value match {
        case s: String => "\"" + s + "\""
        case other     => other.toString
      }
      "\"" + key + "\":" + rendered
    }
    .mkString("{", ",", "}")

def respond(exchange: HttpExchange, status: Int, body: String): Unit = {
  val bytes = body.getBytes(UTF_8)
  exchange.sendResponseHeaders(status, bytes.length.toLong)
  val stream = exchange.getResponseBody
  try stream.write(bytes)
  finally stream.close()
}

def queryInt(exchange: HttpExchange, key: String): Option[Int] = {
  val raw = Option(exchange.getRequestURI.getQuery).getOrElse("")
  raw
    .split("&")
    .iterator
    .map(_.split("=", 2))
    .collectFirst { case Array(k, v) if k == key => v }
    .flatMap(v => scala.util.Try(v.toInt).toOption)
}

@main def lab(arm: String): Unit = {
  val service: Service = arm match {
    case "fixed-await"                      => new AwaitOnFixedPool
    case "global-await" | "global-noextra"  => new AwaitOnGlobalPool
    case "fixed-compose"                    => new ComposeOnFixedPool
    case other =>
      System.err.println(s"unknown arm: $other; expected one of ${Arms.mkString(", ")}")
      sys.exit(2)
  }

  // The server's own executor: a cached thread pool, never the arm's pool.
  val serverExecutor: ExecutorService = Executors.newCachedThreadPool()
  val server: HttpServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0)
  server.setExecutor(serverExecutor)

  server.createContext(
    "/work",
    (exchange: HttpExchange) => {
      val n = queryInt(exchange, "n").getOrElse(0)
      // Waited for on the server thread, at most 30 s; 200 with the number, or 503.
      val answer =
        try Some(Await.result(service.work(n), Duration(30, SECONDS)))
        catch { case _: Throwable => None }
      answer match {
        case Some(value) => respond(exchange, 200, value.toString)
        case None        => respond(exchange, 503, "no answer within 30 s")
      }
    },
  )

  // `/health` answers on the server thread and touches no pool at all.
  server.createContext("/health", (exchange: HttpExchange) => respond(exchange, 200, "ok"))
  server.start()
  val base = s"http://127.0.0.1:${server.getAddress.getPort}"

  // The client, in this same JVM, with its own executor.
  val clientExecutor: ExecutorService = Executors.newCachedThreadPool()
  val http: HttpClient = HttpClient.newBuilder().executor(clientExecutor).build()

  /** Right((status, body)) for an answer, Left("timeout") for the request's own timeout. */
  def get(path: String, timeoutSeconds: Int): Either[String, (Int, String)] = {
    val request = HttpRequest
      .newBuilder(URI.create(base + path))
      .timeout(JavaDuration.ofSeconds(timeoutSeconds.toLong))
      .GET()
      .build()
    try {
      val response = http.send(request, HttpResponse.BodyHandlers.ofString())
      Right((response.statusCode, response.body))
    } catch {
      case _: HttpTimeoutException => Left("timeout")
      case e: Throwable            => Left("failed:" + e.getClass.getSimpleName)
    }
  }

  /** One burst: every request released at once by a latch, each with a 5 s timeout. */
  def burst(size: Int): (Int, Int, Int) = {
    val ok = new AtomicInteger(0)
    val timedOut = new AtomicInteger(0)
    val failed = new AtomicInteger(0)
    val release = new CountDownLatch(1)
    val finished = new CountDownLatch(size)
    for (i <- 0 until size) {
      clientExecutor.execute(() => {
        try {
          release.await()
          get(s"/work?n=$i", 5) match {
            case Right((200, _))  => ok.incrementAndGet()
            case Right(_)         => failed.incrementAndGet()
            case Left("timeout")  => timedOut.incrementAndGet()
            case Left(_)          => failed.incrementAndGet()
          }
        } finally finished.countDown()
      })
    }
    release.countDown()
    finished.await()
    (ok.get, timedOut.get, failed.get)
  }

  var totalOk = 0
  var totalTimedOut = 0
  var totalFailed = 0

  for ((size, index) <- List(8, 20, 20).zipWithIndex) {
    if (index > 0) Thread.sleep(1000L) // one second's pause between bursts
    val (ok, timedOut, failed) = burst(size)
    val probe = get("/work?n=1", 5) match {
      case Right((200, _)) => "ok"
      case _               => "timeout"
    }
    val health = get("/health", 2) match {
      case Right((status, _)) => status
      case Left(_)            => 0
    }
    totalOk += ok
    totalTimedOut += timedOut
    totalFailed += failed
    println(
      "LAB-B " + json(
        "arm" -> arm,
        "burst" -> (index + 1),
        "size" -> size,
        "ok" -> ok,
        "timedOut" -> timedOut,
        "failed" -> failed,
        "probe" -> probe,
        "health" -> health,
      ),
    )
  }

  println(
    "LAB-B " + json(
      "arm" -> arm,
      "total" -> 48,
      "ok" -> totalOk,
      "timedOut" -> totalTimedOut,
      "failed" -> totalFailed,
    ),
  )

  service.shutdown()
  server.stop(0)
  serverExecutor.shutdownNow()
  clientExecutor.shutdownNow()
  // The frozen threads would keep this JVM alive (SCOPE.md 3.1).
  sys.exit(0)
}
