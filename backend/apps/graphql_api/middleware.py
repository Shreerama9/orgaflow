"""
GraphQL Performance Middleware
Logs query execution time for performance monitoring.
"""

import time
import logging

logger = logging.getLogger('graphql.performance')


class PerformanceMiddleware:
    """
    Middleware to log GraphQL query execution time.
    Helps identify slow queries and optimize performance.
    """

    def resolve(self, next, root, info, **args):
        """
        Measure and log the execution time of GraphQL resolvers.

        Args:
            next: The next resolver in the chain
            root: The root value
            info: GraphQL resolve info containing query details
            **args: Additional arguments passed to the resolver

        Returns:
            The result from the next resolver
        """
        start_time = time.time()

        # Execute the next resolver
        result = next(root, info, **args)

        # Calculate execution time
        execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds

        # Log performance data
        field_name = info.field_name
        parent_type = info.parent_type.name if info.parent_type else 'Unknown'

        # Only log if execution took longer than 100ms
        if execution_time > 100:
            logger.warning(
                f"Slow query detected: {parent_type}.{field_name} took {execution_time:.2f}ms"
            )
        else:
            logger.debug(
                f"{parent_type}.{field_name} executed in {execution_time:.2f}ms"
            )

        return result
