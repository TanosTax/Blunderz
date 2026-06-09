FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["ChessBackend/ChessBackend.csproj", "ChessBackend/"]
RUN dotnet restore "ChessBackend/ChessBackend.csproj"

COPY . .
WORKDIR "/src/ChessBackend"
RUN dotnet publish "ChessBackend.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

# Устанавливаем только Stockfish
RUN apt-get update && \
    apt-get install -y stockfish && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 80
EXPOSE 443

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ChessBackend.dll"]