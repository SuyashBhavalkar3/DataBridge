import zipfile
import xml.etree.ElementTree as ET

def read_docx(path):
    z = zipfile.ZipFile(path)
    xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    text = [node.text for node in tree.iter('{%s}t' % ns['w']) if node.text]
    with open('kt_document.txt', 'w', encoding='utf-8') as f:
        f.write(' '.join(text))

read_docx('DataBridge_KT_Document.docx')
