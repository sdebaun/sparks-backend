#! /bin/bash
echo CONFIRMED
cat $1 | grep $2 | grep CONFIRMED | wc -l
echo ACCEPTED
cat $1 | grep $2 | grep ACCEPTED | wc -l
echo APPLIED
cat $1 | grep $2 | grep APPLIED | wc -l
