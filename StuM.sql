CREATE DATABASE IF NOT EXISTS StudentMarksDB;
use StudentMarksDB;

CREATE TABLE IF NOT EXISTS Marks (
   StudentID INT AUTO_INCREMENT PRIMARY KEY,
   StudentName varchar(50),
   ObtainedMarks float,
   Grade varchar(5)
);

CREATE TABLE IF NOT EXISTS Stats (
    StatsID INT AUTO_INCREMENT PRIMARY KEY,
    AverageMarks FLOAT,
    MaxMarks FLOAT,
    MinMarks FLOAT,
    TotalStudents INT
);


