# apply-flow-service
Interface for managing and executing custom product experiences

## Setup

1. Run `npm run dev:setup` to initialize the development environment. This will:
   - Copy necessary configuration files
   - Build Docker images
   - Install dependencies
   - Create required directories
   - Set appropriate permissions

## Development Scripts

The following npm scripts are available for development:

### Starting/Stopping the Service
- `npm run dev` - Start the service in development mode
- `npm run dev:stop` - Stop all running containers
- `npm run dev:restart` - Restart the service container
- `npm run dev:clean` - Stop and remove all containers, volumes, and networks

### Development Tools
- `npm run dev:debug` - Start the service with debugging enabled on port 9229
- `npm run dev:logs` - View container logs
- `npm run dev:shell` - Open a shell in the service container
- `npm run dev:build` - Rebuild the service container

### Testing
- `npm run dev:test` - Run tests in the test container
- `npm run dev:test:watch` - Run tests in watch mode

## Debugging

To debug the application:

1. Run `npm run dev:debug` to start the service in debug mode
2. Connect your IDE to port 9229
3. Add breakpoints in your code
4. The debugger will automatically reconnect when the service reloads

## Container Management

The development environment uses several Docker containers:

- `service`: The main application container
- `gateway`: Nginx gateway for routing
- `mountebank`: Mock service for external dependencies
- `vault`: Secret management
- `redis`: Caching and session storage

To manage containers:

- View container status: `docker compose ps`
- View container logs: `npm run dev:logs`
- Restart containers: `npm run dev:restart`
- Reset environment: `npm run dev:clean`

## Troubleshooting

### Common Issues

1. **Container fails to start**
   - Check logs with `npm run dev:logs`
   - Ensure all required ports are available
   - Try cleaning the environment with `npm run dev:clean`

2. **Dependencies not installing**
   - Ensure .npmrc is properly configured
   - Try removing node_modules and running `npm run dev:setup` again

3. **Changes not reflecting**
   - Ensure you're editing files in the correct location
   - Check if file watching is working
   - Try restarting the service with `npm run dev:restart`

4. **Debug port not connecting**
   - Ensure no other process is using port 9229
   - Check if the service container is running
   - Verify debug configuration in your IDE

### Environment Variables

Key environment variables for development:

```env
NODE_ENV=development
DEBUG=apply-flow-service:*
PORT=3000
```

See `.env.development` for all available configuration options.

## Best Practices

1. Always use npm scripts instead of running docker commands directly
2. Keep the development environment up to date with `npm run dev:setup`
3. Use `npm run dev:clean` when switching branches or after major changes
4. Check logs with `npm run dev:logs` when troubleshooting
5. Use the debug mode for complex issues

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Express.js Documentation](https://expressjs.com/)