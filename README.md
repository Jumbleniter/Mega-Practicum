# JQuery-Practicum

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Jumbleniter/JQuery-Practicum)
No, don't do that.

-3/1/2025

1️⃣ Navigate to Your public/ Folder
First, make sure you're inside your project's public/ folder in VS Code:

cd path/to/your/project/public
Replace path/to/your/project with the actual path.

2️⃣ Download Bootstrap & jQuery Using Terminal
✅ Download Bootstrap CSS

curl -o bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css
or using wget (Mac/Linux users):

wget -O bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css
✅ Download Bootstrap JS

curl -o bootstrap.bundle.min.js https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js
or using wget:

wget -O bootstrap.bundle.min.js https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js
✅ Download jQuery

curl -o jquery.min.js https://code.jquery.com/jquery-3.6.4.min.js
or using wget:


wget -O jquery.min.js https://code.jquery.com/jquery-3.6.4.min.js
3️⃣ Verify Files in VS Code
Once downloaded, open your public/ folder in VS Code and confirm you see:


/public
├── index.html
├── script.js
├── bootstrap.min.css
├── bootstrap.bundle.min.js
├── jquery.min.js
