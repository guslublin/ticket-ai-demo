FROM mcr.microsoft.com/dotnet/sdk:10.0

RUN apt-get update \
    && apt-get install -y python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY ./python/requirements.txt /tmp/requirements.txt

RUN python3 -m venv /opt/venv
RUN /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt

COPY ./api ./api
COPY ./python ./python

RUN dotnet restore ./api/api.csproj
RUN dotnet publish ./api/api.csproj -c Release -o /app/publish

WORKDIR /app

ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 8080

CMD ["dotnet", "/app/publish/api.dll"]