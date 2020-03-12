#!/bin/bash

trap 'kill $(jobs -p)' EXIT

mkdir -p /tmp/puissance4/serial

socat -d -d pty,raw,echo=0,link=/tmp/puissance4/serial/ttyS0 pty,raw,echo=0,link=/tmp/puissance4/serial/ttyS1 &

npm start -- --port 32564 &

wait_seconds=10
until test $((wait_seconds--)) -eq 0 -o -f ".simu_env"; do sleep 1; done
$((++wait_seconds))

if test ! -f ".simu_env"
then
  echo "ERROR: CAN'T START SIMU SERVER"
  exit -1
fi
. .simu_env

URL="http://localhost:"${SIMU_PORT}"/ihm.html"

echo ${URL}

if which xdg-open > /dev/null
then
  xdg-open ${URL}
elif which gnome-open > /dev/null
then
  gnome-open ${URL}
else
  echo "Vous pouvez ouvrir un navigateur et accéder à l'URL: " ${URL}
fi

wait

