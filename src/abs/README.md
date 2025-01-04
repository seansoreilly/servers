# ABS MCP Server

Model Context Protocol server for accessing the Australian Bureau of Statistics (ABS) Data API.

## Overview

This MCP server provides access to Australian statistical data including economic, social and Census information through the ABS Data API. The API follows the Statistical Data and Metadata Exchange (SDMX) standard.

## Installation

```bash
npm install @mcp/abs-server
```

## Usage with MCP Client

### Recommended Configuration

When using this MCP server, configure your client with these recommended defaults:

```json
{
  "mcpServers": {
    "abs": {
      "defaults": {
        "get_data": {
          "startPeriod": "2021",
          "endPeriod": "2024",
          "responseFormat": "csvfile"
        }
      }
    }
  }
}
```

These defaults:

- Set a sensible time range for historical data (2021-2024)
- Use CSV format for easy data processing
- Can be overridden in individual requests when needed

### Example Client Usage

With defaults configured:

```json
{
  "name": "get_data",
  "arguments": {
    "dataflowIdentifier": "ABS_ANNUAL_ERP_ASGS2016"
  }
}
```

Overriding defaults:

```json
{
  "name": "get_data",
  "arguments": {
    "dataflowIdentifier": "ABS_ANNUAL_ERP_ASGS2016",
    "startPeriod": "2023",
    "responseFormat": "jsondata"
  }
}
```

## Tools

### get_data

Retrieves data from a specific ABS dataflow.

**Parameters:**

- `dataflowIdentifier` (required): The identifier of the dataflow (e.g., 'ABS_ANNUAL_ERP_ASGS2016')
- `dataKey` (optional): Filter data using dimension values separated by dots
- `startPeriod` (optional): Start period (defaults to last year)
- `endPeriod` (optional): End period (defaults to current year)
- `responseFormat` (optional): Response format (defaults to "csvfile")

**DataKey Format:**

- Use dots to separate dimension values (e.g., "1.AUS")
- Use "all" for all values in a dimension
- Use + for OR operations (e.g., "1.115486+131189")
- Use empty slots between dots for wildcards (e.g., "1..Q")

**Period Formats:**

- Year: yyyy (e.g., "2023")
- Semester: yyyy-Sn (e.g., "2023-S1")
- Quarter: yyyy-Qn (e.g., "2023-Q1")
- Month: yyyy-mm (e.g., "2023-01")

**Response Formats:**

- `csvfile` (default): CSV with dimension codes
- `csvfilewithlabels`: CSV with dimension codes and labels
- `jsondata`: SDMX JSON format
- `genericdata`: SDMX XML generic format
- `structurespecificdata`: SDMX XML structure-specific format

Example:

```json
{
  "name": "get_data",
  "arguments": {
    "dataflowIdentifier": "ABS_ANNUAL_ERP_ASGS2016",
    "startPeriod": "2021",
    "endPeriod": "2024",
    "responseFormat": "csvfile"
  }
}
```

### list_dataflows

Lists all available ABS statistical dataflows.

**Parameters:** None

Example:

```json
{
  "name": "list_dataflows",
  "arguments": {}
}
```

Response:

```json
{
  "toolResult": [
    {
      "id": "ABORIGINAL_POP_PROJ",
      "name": "Projected population, Aboriginal and Torres Strait Islander Australians",
      "version": "1.3.0"
    }
  ]
}
```

## Configuration

No configuration required. The server connects directly to the ABS Data API at `https://data.api.abs.gov.au/rest`.

## Logging

Logs are written to `logs/abs-api.log` and include:

- Request URLs and parameters
- Response status and headers
- Error messages and stack traces
- Response sizes and content types

## Notes

- This is a beta service and availability is not guaranteed
- Data may not be the most up-to-date - refer to the ABS website for latest information
- Maximum dataKey length is 260 characters
- The service follows the SDMX RESTful web services specification

## Support

For issues with the ABS Data API:

- Email: api.data@abs.gov.au
- Join their register of interest to be notified of API changes

For issues with this MCP server implementation:

- Open an issue in the repository

## License

MIT
