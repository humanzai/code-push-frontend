#!/bin/bash

# Recreate config file
rm -rf ./config.json
touch ./config.json

# Start JSON object
echo "{" >> ./config.json

# Check if .env file exists
if [[ -f .env ]]; then
  # Read each line in .env file
  # Each line represents key=value pairs
  while read -r line || [[ -n "$line" ]];
  do
    # Split env variables by character `=`
    if printf '%s\n' "$line" | grep -q -e '='; then
      varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
      varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
    fi

    # Read value of current variable if exists as Environment variable
    value=$(printf '%s\n' "${!varname}")
    # Otherwise use value from .env file
    [[ -z $value ]] && value=${varvalue}

    # Append configuration property to JS file
    echo "  \"$varname\": \"$value\"," >> ./config.json
  done < .env
else
  # If .env does not exist, read from config.example.json
  if [[ -f config.example.json ]]; then
    # Extract keys from config.example.json
    keys=$(jq -r 'keys[]' config.example.json)
    for varname in $keys; do
      value=$(printf '%s\n' "${!varname}")
      # Use value from environment variables if available, otherwise use empty string
      [[ -z $value ]] && value=""
      echo "  \"$varname\": \"$value\"," >> ./config.json
    done
  fi
fi

# Remove the trailing comma from the last line
sed -i '' '$ s/,$//' ./config.json

# End JSON object
echo "}" >> ./config.json