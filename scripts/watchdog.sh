#!/bin/bash
# Gig Monitor Watchdog — checks if today's morning report was generated
TODAY=$(date +%Y-%m-%d)
REPORT="/Users/alexhale/Projects/Gig-Engine/data/reports/${TODAY}.md"
ENV_FILE="/Users/alexhale/Projects/Gig-Engine/.env.monitor"

# Source env for Telegram credentials
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

if [ ! -f "$REPORT" ]; then
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_CHAT_ID}" \
      -d "text=Morning report MISSING for ${TODAY}. Check logs at Gig-Engine/logs/" \
      > /dev/null 2>&1
  fi
  echo "WATCHDOG: Report missing for ${TODAY}"
  exit 1
else
  echo "WATCHDOG: Report exists for ${TODAY}"
  exit 0
fi
