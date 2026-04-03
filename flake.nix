{
  description = "Telegram Lichess Mini App (C# + React + WebStorm)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { 
        inherit system; 
        config.allowUnfree = true; # Обязательно для WebStorm и ngrok
      };
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [
          # Backend: .NET 10
          pkgs.dotnet-sdk_10
          pkgs.dotnet-runtime_10
          
          # Frontend: Node.js + pnpm
          pkgs.nodejs_22
          pkgs.nodePackages.pnpm
          
          # Infrastructure
          pkgs.docker-compose
          pkgs.ngrok
          pkgs.redis
          pkgs.pgcli
        ];

        DOTNET_ROOT = pkgs.dotnet-sdk_10;
        DOTNET_CLI_TELEMETRY_OPTOUT = "1";
        DOTNET_NOLOGO = "1";

        shellHook = ''
          export NUGET_PACKAGES="$PWD/.nuget-packages"
          export PATH="$PWD/frontend/node_modules/.bin:$PATH"

          # Сетевые фиксы из твоего примера
          export DOTNET_SYSTEM_NET_DISABLEIPV6=1
          export DOTNET_SYSTEM_NET_HTTP_USESOCKETSHTTPHANDLER=0
          export DOTNET_SYSTEM_NET_HTTP_SOCKETSHTTPHANDLER_HTTP2SUPPORT=0
          export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

          echo "🚀 Environment with WebStorm loaded!"
          echo "Чтобы запустить IDE, введите: webstorm ."
        '';
      };
    };
}

