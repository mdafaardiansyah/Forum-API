# SSL Certificate Configuration

This directory contains SSL certificates required for HTTPS configuration in production.

## Required Files

For production deployment, you need to place the following SSL certificate files in this directory:

1. **certificate.crt** - Your SSL certificate file
2. **private.key** - Your private key file
3. **ca_bundle.crt** - Certificate Authority bundle (optional, for some providers)

## Obtaining SSL Certificates

### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate for your domain
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to this directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certificate.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./private.key
```

### Option 2: Commercial SSL Provider

1. Purchase SSL certificate from providers like:
   - DigiCert
   - Comodo
   - GoDaddy
   - Namecheap

2. Follow provider's instructions to generate CSR and obtain certificates

3. Place the files in this directory with the correct names

### Option 3: Self-Signed Certificate (Development Only)

```bash
# Generate self-signed certificate (NOT for production)
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.crt -days 365 -nodes
```

## File Permissions

Ensure proper file permissions for security:

```bash
# Set secure permissions
chmod 600 private.key
chmod 644 certificate.crt
chmod 644 ca_bundle.crt

# Change ownership to appropriate user
chown root:root *.crt *.key
```

## Docker Configuration

The SSL certificates are mounted as read-only volumes in the NGINX container:

```yaml
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

## NGINX Configuration

The certificates are referenced in `nginx.conf`:

```nginx
ssl_certificate /etc/nginx/ssl/certificate.crt;
ssl_certificate_key /etc/nginx/ssl/private.key;
```

## Certificate Renewal

### Let's Encrypt Auto-Renewal

```bash
# Add to crontab for automatic renewal
0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual Renewal Process

1. Obtain new certificates from your provider
2. Replace the files in this directory
3. Restart the NGINX container:
   ```bash
   docker-compose -f docker-compose.prod.yml restart nginx
   ```

## Security Best Practices

1. **Never commit SSL certificates to version control**
2. Use strong encryption (RSA 2048-bit minimum, RSA 4096-bit recommended)
3. Enable HSTS (HTTP Strict Transport Security)
4. Use modern TLS protocols (TLSv1.2 and TLSv1.3 only)
5. Regularly update and renew certificates
6. Monitor certificate expiration dates

## Troubleshooting

### Certificate Validation

```bash
# Check certificate details
openssl x509 -in certificate.crt -text -noout

# Verify certificate and key match
openssl x509 -noout -modulus -in certificate.crt | openssl md5
openssl rsa -noout -modulus -in private.key | openssl md5
```

### Common Issues

1. **Certificate and key mismatch**: Ensure both files are from the same certificate generation
2. **Wrong file format**: Certificates should be in PEM format
3. **Expired certificates**: Check expiration date and renew if necessary
4. **Incorrect file permissions**: Ensure NGINX can read the certificate files

## Monitoring

Set up monitoring for certificate expiration:

```bash
# Check certificate expiration
openssl x509 -enddate -noout -in certificate.crt
```

Consider using tools like:
- SSL Labs SSL Test
- Certificate monitoring services
- Automated alerts for expiration

---

**Important**: This directory is included in `.gitignore` to prevent accidental commit of sensitive SSL certificates.