# ⚡ PhotonOS: The Virtual Companion OS

> **"I didn't visit a game website. I entered a computer."**

An original, lightweight browser-based game & operating system experience inspired by virtual companions, computer mystery, and software comedy. Built with pure HTML5, CSS3, ES Modules, Canvas, and Web Audio API — **zero dependencies, 100% browser native.**

---

## 🌟 Key Features

### 🖥️ 1. Simulated Operating System (PhotonOS v4.0.2)
- **Glassmorphic Desktop UI**: Complete with custom interactive wallpaper particle engine, desktop grid shortcuts, responsive taskbar, and live overcharged battery level (**104% ⚡**).
- **Window Manager**: Draggable by titlebar, resizable from corners/edges, minimize `_`, maximize `□`, close `✕`, active window stacking z-index layering, and live taskbar tab syncing.
- **Virtual File System (VFS)**: Persistent file storage in `localStorage` supporting directories (`/home/guest`, `/system`, `/trash`), text file editor, and dynamic story file injections (`pet_diary.txt`).
- **Web Audio API Synthesizer**: 100% self-contained audio engine producing retro window chimes, click sounds, pet squeaks, feed crunching, and terminal typing beeps.

---

### 🌐 2. Photon Browser & The 17 Download Buttons
- **Fake Browser Engine**: Includes navigation toolbar, bookmarks bar, and fake web pages like *QuantumSearch*, *ScamSecurity Antivirus*, and *Captcha Master*.
- **The Infamous Virtual Pet Download Page**: Contains **17 ridiculous download buttons**! 16 of them trigger hilarious fake popups or ad redirects. Clicking the ONE real button downloads **Byte the Blob**.
- **AdBlocker Hater Mechanics**: If the OS AdBlocker is disabled, simulated ad popups invade the browser screen. Enable AdBlocker in Terminal (`sudo adblock enable`) to clear ads!

---

### 👾 3. Virtual Companion: "Byte the Blob"
- **Procedural 2D Canvas Renderer**: Cute, organic bouncy cyan vector blob with expressive eyes, procedural mouth shapes, floating accessories (top hat, glasses), and emotion states (*Happy, Curious, Hungry, Sleepy, Glitch*).
- **Companion Stats & Mini-Games**: Feed Byte RAM chips & binary cookies, play "Bounce & Catch" mini-games, and view live friendship stats.
- **Contextual AI Chat**: Byte remembers your recent OS actions! (e.g. reading specific files, running terminal commands, checking processes).
- **Desktop Breakout**: Byte can escape its app window and float directly on your OS Desktop overlay as an interactive desktop companion!

---

### 💻 4. Interactive Terminal & Physics Gravity Hack
- **Command Shell**: Supports `help`, `ls`, `cd`, `cat`, `touch`, `rm`, `mkdir`, `clear`, `open`, `ps`, and `top`.
- **`sudo adblock enable`**: Toggles system adblocker with hilarious authorization commentary.
- **`sudo apt install antigravity`**: **Physics Easter Egg!** Disables OS gravity. Desktop icons and open windows float upward, bouncing off screen boundaries with realistic velocity vectors.
- **`sudo systemctl restart gravity`**: Fails with *"gravity is currently on vacation in Hawaii."*

---

## 🎮 How to Play / Run Locally

No build step required! Simply launch a local HTTP server:

```bash
python3 -m http.server 8080
```

Then open your browser at `http://localhost:8080`.

---

## 🏆 Project Philosophy
Created for **Photon Studios** — small enough to ship smoothly, distinctive enough to demonstrate creative technical identity.
