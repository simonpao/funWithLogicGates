#!/bin/sh

while read -r p; do
  cat ../"$p" >> ../fun.js
done < load-order