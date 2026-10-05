// Pinned to the sbt image of SCOPE.md (facts F6): sbt 1.13.0 and Scala 3.8.4 are already inside it, so
// the program compiles with no network. Standard library and JDK only: no libraryDependencies.
scalaVersion := "3.8.4"

// Each arm runs in a JVM of its own; a frozen pool never recovers (facts F7).
fork := true
