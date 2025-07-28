Files are build and deployed to `/var/www/socket-print`

`/etc/nginx/sites-enabled/socket-print` is a link to the conf file mentioned here...

`/etc/nginx/sites-available/socket-print`

```conf
server {
    listen 80;
    server_name 209.38.172.166;

    root /var/www/socket-print;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }
}
```