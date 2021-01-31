#!/usr/bin/python

import sys

input = open(sys.argv[1], 'r').read()
pattern = sys.argv[2]
include = open(sys.argv[3]).read()

print("Input: {0}".format(sys.argv[1]))
print("pattern to replace: {0}".format(pattern))
print("File to include: {0}".format(sys.argv[3]))

output = input.replace(pattern, include)

open(sys.argv[1], 'w').write(output)





