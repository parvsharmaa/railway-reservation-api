#!/bin/sh

set -e

host="$1"
shift
port="$1"
shift
timeout="$1"
shift
cmd="$@"

until nc -z "$host" "$port"; do
  echo "Waiting for $host:$port..."
  sleep 1
done

exec $cmd