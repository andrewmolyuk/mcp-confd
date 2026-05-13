FROM alpine:3.23

# Install necessary packages for development.
RUN apk update && apk add git gnupg openssh curl make bash nodejs zsh

RUN adduser -D -s /bin/zsh dev
USER dev
WORKDIR /home/dev

# Install Oh My Zsh for dev user
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" || true

ENV BUN_INSTALL=/home/dev/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

# Install Bun for the dev user so bun/bunx are available in interactive shells.
# Bun installer currently only places `bun`; add a `bunx` compatibility entrypoint.
RUN curl -fsSL https://bun.sh/install | bash \
	&& ln -sf "${BUN_INSTALL}/bin/bun" "${BUN_INSTALL}/bin/bunx"