#!/usr/bin/env sh

#
# This script simply executes a provided JavaScript test using
# the local environment established with the `docker-compose`.
# 
# Each execution is provided a unique tag to differentiate
# discrete test runs within the Grafana dashboard.
#

set -e

if [ $# -ne 1 ]; then
    echo "Usage: ./docker-run.sh <SCRIPT_NAME>"
    exit 1
fi

SCRIPT_NAME=$1
TAG_NAME="$(basename -s .js $SCRIPT_NAME)-$(date +%s)"

docker run -i --network=workshop-k6-nerdearla2023_default grafana/k6 run -o experimental-prometheus-rw \
-e BASE_URL=http://quickpizza:3333 \
-e K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write \
-e K6_PROMETHEUS_RW_STALE_MARKERS=true \
-e K6_PROMETHEUS_RW_TREND_STATS="p(95),p(99),min,max" -<$SCRIPT_NAME --tag testid=$TAG_NAME


# for testing without tags
# docker-compose run --rm -T k6 run -<$SCRIPT_NAME 
