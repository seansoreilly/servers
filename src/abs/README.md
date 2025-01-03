# ABS Data API MCP Server

A Model Context Protocol (MCP) server for accessing the Australian Bureau of Statistics (ABS) Data API. This server provides programmatic access to Australian statistical data including economic, social, and Census information through a standardized interface.

## Features

- Access to ABS statistical datasets via SDMX-compliant API
- Default CSV output format for easy data processing
- Support for multiple data formats (CSV, JSON)
- Automatic time period handling with smart defaults
- Detailed logging for request/response tracking

## Available Tools

### 1. `get_data`

Retrieves data from a specific ABS dataflow.

**Parameters:**

- `dataflowIdentifier` (required): The identifier of the dataflow
- `dataKey` (optional): Key parameters for filtering (e.g., '1.AUS')
- `startPeriod` (optional): Start period (e.g., '2023', defaults to last year)
- `endPeriod` (optional): End period (e.g., '2024', defaults to current year)
- `responseFormat` (optional): Response format (defaults to 'csvfile')

### 2. `list_dataflows`

Lists all available ABS statistical dataflows.

**Parameters:** None

## Installation

```bash
npm install
```

## Usage

The server can be started using:

```bash
node index.js
```

## API Base URL

All requests are made to the ABS Data API at:

```
https://data.api.abs.gov.au/rest
```

## Technical Details

- Built with TypeScript
- Uses Zod for runtime type validation
- Implements the Model Context Protocol for standardized communication
- Handles both CSV and JSON response formats
- Includes error handling and detailed logging

## Dependencies

- `@modelcontextprotocol/sdk`: MCP server implementation
- `node-fetch`: HTTP client
- `zod`: Schema validation

## Error Handling

The server includes comprehensive error handling for:

- API request failures
- Invalid response formats
- Empty responses
- JSON parsing errors
- Schema validation errors

## Development

The project uses TypeScript with the following structure:

- `index.ts`: Main server implementation
- `schemas.ts`: Zod schema definitions
- Support for ESM modules

## Notes

- The ABS API is in beta and availability is not guaranteed
- Data may not be real-time - refer to the ABS website for latest information
- The service follows the SDMX RESTful web services specification

## Support

For issues with the ABS Data API:

- Email: api.data@abs.gov.au

For issues with this MCP server implementation:

- Please open an issue in the repository
