FROM tiangolo/nginx-rtmp:latest

# Remove default config and copy our custom config
COPY nginx.conf /etc/nginx/nginx.conf

# Create HLS directory
RUN mkdir -p /tmp/hls && chmod 777 /tmp/hls

EXPOSE 1935 8080

CMD ["nginx", "-g", "daemon off;"]
