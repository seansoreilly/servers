# ABS Data API MCP Server

Model Context Protocol (MCP) Server for the Australian Bureau of Statistics (ABS) Data API, enabling access to Australian statistical data including economic, social and Census information.

## About

This server provides a Model Context Protocol interface to the ABS Data API (Beta). The API follows the Statistical Data and Metadata Exchange (SDMX) standard and allows access to detailed Australian statistical data.

## Features

- Access to ABS statistical datasets including economic, social and Census data
- Support for multiple data formats (XML, JSON, CSV)
- Metadata retrieval capabilities
- SDMX-compliant interface

## Tools

1. `get_data`
   - Retrieve data from a specific dataflow
   - Inputs:
     - `dataflowIdentifier` (string): The identifier of the dataflow
     - `dataKey` (string): The key identifying specific data
     - `format` (string, optional): Response format ('xml', 'json', or 'csv', defaults to 'json')
   - Returns: Statistical data in the requested format

2. `get_structure_list`
   - Get all structures of a specific type
   - Inputs:
     - `structureType` (string): Type of structure to retrieve
     - `agencyId` (string): The agency identifier
   - Returns: List of available structures

3. `get_structure`
   - Get a specific structure
   - Inputs:
     - `structureType` (string): Type of structure to retrieve
     - `agencyId` (string): The agency identifier
     - `structureId` (string): The structure identifier
   - Returns: Latest version of the requested structure

4. `get_structure_version`
   - Get a specific version of a structure
   - Inputs:
     - `structureType` (string): Type of structure to retrieve
     - `agencyId` (string): The agency identifier
     - `structureId` (string): The structure identifier
     - `structureVersion` (string): Version of the structure
   - Returns: Specific version of the requested structure

## Endpoints

The server interacts with the following ABS Data API endpoints:

- `GET /rest/data/{dataflowIdentifier}/{dataKey}`: Retrieve statistical data
- `GET /rest/{structureType}/{agencyId}`: Get all structures of a specific type
- `GET /rest/{structureType}/{agencyId}/{structureId}`: Get latest structure
- `GET /rest/{structureType}/{agencyId}/{structureId}/{structureVersion}`: Get specific structure version

## Setup

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

#### Docker
```json
{
  "mcpServers": {
    "abs": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "mcp/abs"
      ]
    }
  }
}
```

### NPX

```json
{
  "mcpServers": {
    "abs": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-abs"
      ]
    }
  }
}
```

## Build

Docker build:

```bash
docker build -t mcp/abs -f src/abs/Dockerfile .
```

## Important Notes

1. This API is in beta and availability is not guaranteed
2. Data may not always be the most up-to-date - refer to the ABS website for latest information
3. The service follows the SDMX RESTful web services specification
4. Base URL for all requests: data.api.abs.gov.au
5. Supports HTTPS only

## Support

For issues or questions regarding the ABS Data API:
- Email: api.data@abs.gov.au
- You can request to join their register of interest to be notified of API changes

## License

This MCP server is licensed under the MIT License. See the LICENSE file in the project repository for full license text.

## References

- SDMX RESTful web services specification: [GitHub](https://github.com/sdmx-twg/sdmx-rest)
- ABS Website: [https://www.abs.gov.au/](https://www.abs.gov.au/)
