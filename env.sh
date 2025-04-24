#!/bin/bash

# Recreate config file
rm -rf ./config.js
touch ./config.js

# Start JSON object
echo "window.SERVER_CONF = {" >> ./config.js

# Check if .env file exists
if [[ -f .env ]]; then
  # Read each line in .env file
  # Each line represents key=value pairs
  while read -r line || [[ -n "$line" ]];
  do
    # Split env variables by character `=`
    if printf '%s\n' "$line" | grep -q -e '='; then
      varname=$(printf '%s\n' "$line" | sed -e 's/=.*//' | xargs)
      varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//' | xargs)
    fi

    if [[ -n "$varname" ]]; then
      # Read value of current variable if exists as Environment variable
      value=$(printf '%s\n' "${!varname}")
      # Otherwise use value from .env file
      [[ -z $value ]] && value=${varvalue}

      # Append configuration property to JS file if varname and value are not empty
      if [[ -n "$value" ]]; then
        echo "  \"$varname\": \"$value\"," >> ./config.js
      fi
    fi
  done < .env
else
  # If .env does not exist, read from config.example.json
  if [[ -f config.example.json ]]; then
    # Extract keys from config.example.json
    keys=$(jq -r 'keys[]' config.example.json)
    for varname in $keys; do
      if [[ -n "$varname" ]]; then
        value=$(printf '%s\n' "${!varname}")
        # Use value from environment variables if available, otherwise use empty string
        [[ -z $value ]] && value=""
        if [[ -n "$value" ]]; then
          echo "  \"$varname\": \"$value\"," >> ./config.js
        fi
      fi
    done
  fi
fi

# Remove the trailing comma from the last line and close the object properly
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' '$ s/,$//' ./config.js
else
  sed -i '$ s/,$//' ./config.js
fi

# End JavaScript object
echo "};" >> ./config.js