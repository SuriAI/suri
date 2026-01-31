# Installation & Setup

This guide will help you set up Suri for development or build it for production.

## Prerequisites

Ensure you have the following installed:
- **OS**: Windows 10/11, macOS 10.14+, or Linux
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **Git**: Latest version
- **Hardware**: Webcam required. Dedicated GPU (NVIDIA) recommended for high-traffic environments.

## System Specifications

Suri is optimized for efficiency but scales with hardware capabilities.

| Tier | Spec | Capacity |
| :--- | :--- | :--- |
| **Minimum** | CPU (AVX2 Support), 4GB RAM | < 5 Faces / Second |
| **Recommended** | Intel i5 / Ryzen 5, 8GB RAM | 10+ Faces / Second |
| **Performance** | NVIDIA RTX Series (CUDA), 16GB RAM | 30+ Faces / Second (Real-Time) |

> [!TIP]
> **Troubleshooting**: Encountering issues? See the [Diagnostic Guide](TROUBLESHOOTING.md).

## Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/suriAI/suri.git
cd suri
```

### 2. Backend Setup (Python)
Navigate to the server directory and set up the virtual environment.

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup (React/Electron)
Open a new terminal window for the app.

```bash
cd app
pnpm install
```

### 4. Running Locally
Run the application with a single command. The Electron app will automatically launch the Python backend.

```bash
cd app
pnpm dev
```

The application window will open once the backend service is ready.
> **Note**: You do not need to run the Python server manually; the app manages the process for you.

## Building for Production

To create a standalone executable/installer for your OS:

```bash
cd app
pnpm run dist:win   # For Windows
pnpm run dist:mac   # For macOS
pnpm run dist:linux # For Linux
```

The output files (setup.exe, .dmg, etc.) will be located in `app/dist`.
