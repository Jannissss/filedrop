from flask import Flask, request, send_from_directory, jsonify, render_template, Response
import os
import zipfile
import io



app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)



@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    file.save(os.path.join(UPLOAD_FOLDER, file.filename))
    return '', 204

@app.route('/files')
def files():
    return jsonify(os.listdir(UPLOAD_FOLDER))

@app.route('/download/<filename>')
def download(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

@app.route('/download_zip', methods=['POST'])
def download_zip():
    files = request.json.get('files', [])
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename in files:
            path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(path):
                zipf.write(path, arcname=filename)

    buffer.seek(0)

    return Response(
        buffer.getvalue(),
        mimetype='application/zip',
        headers={
            'Content-Disposition': 'attachment; filename=files.zip'
        }
    )

@app.route('/delete', methods=['POST'])
def delete_files():
    files = request.json.get('files', [])
    if files == 'ALL':
        for f in os.listdir(UPLOAD_FOLDER):
            os.remove(os.path.join(UPLOAD_FOLDER, f))
    else:
        for f in files:
            path = os.path.join(UPLOAD_FOLDER, f)
            if os.path.exists(path):
                os.remove(path)
    return jsonify(success=True)



if __name__ == '__main__':
    app.run(host="0.0.0.0", port=9094)
