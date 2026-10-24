# Dockerfile — Áquila Pro Network Guard (DNS Shield Module)
FROM pihole/pihole:2024.07.0

# Define fuso horário padrão do ecossistema escolar brasileiro
ENV TZ="America/Sao_Paulo"

# DNS Upstream Soberanos e Seguros (Cloudflare Security)
ENV PIHOLE_DNS_="1.1.1.3;1.0.0.3"
ENV DNSSEC="true"

# Bloquear domínios maliciosos e anúncios para laboratórios escolares
# E expor portas DNS nativas
EXPOSE 53/tcp
EXPOSE 53/udp
EXPOSE 80/tcp

# O Pi-hole oficial utiliza o S6 overlay como processo init
CMD ["/s6-init"]
