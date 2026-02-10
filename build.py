"""
打包脚本 - 使用 PyInstaller 将 Flask 应用打包为 .exe
"""
import PyInstaller.__main__
import os
import shutil

# 获取项目根目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 清理之前的构建
def clean_build():
    dirs_to_remove = ['build', 'dist', '__pycache__']
    for dir_name in dirs_to_remove:
        dir_path = os.path.join(BASE_DIR, dir_name)
        if os.path.exists(dir_path):
            print(f"删除 {dir_name}...")
            shutil.rmtree(dir_path)
    
    # 删除 .spec 文件
    for file in os.listdir(BASE_DIR):
        if file.endswith('.spec'):
            print(f"删除 {file}...")
            os.remove(os.path.join(BASE_DIR, file))

# 打包配置
def build_exe():
    print("开始打包 Flask 应用...")
    
    # 参数列表
    args = [
        'app.py',                          # 主入口文件
        '--name=入库清单核对系统',          # exe 名称
        '--onefile',                       # 打包为单个 exe
        '--windowed',                      # 无控制台窗口（GUI模式）
        '--icon=icon.ico',                 # 图标文件（如果有的话）
        # 添加数据文件 (templates 和 static)
        '--add-data=templates;templates',
        '--add-data=static;static',
        # 隐藏导入
        '--hidden-import=flask',
        '--hidden-import=requests',
        '--hidden-import=dotenv',
        '--hidden-import=urllib3',
        '--hidden-import=charset_normalizer',
        '--hidden-import=idna',
        '--hidden-import=certifi',
        # 排除不必要的模块以减小体积
        '--exclude-module=matplotlib',
        '--exclude-module=numpy',
        '--exclude-module=pandas',
        '--exclude-module=PIL',
        '--exclude-module=PyQt5',
        '--exclude-module=PyQt6',
        '--exclude-module=tkinter',
        # 其他选项
        '--clean',                         # 清理临时文件
        '--noconfirm',                     # 不询问确认
    ]
    
    # 如果没有图标文件，移除 --icon 参数
    icon_path = os.path.join(BASE_DIR, 'icon.ico')
    if not os.path.exists(icon_path):
        args = [arg for arg in args if not arg.startswith('--icon=')]
    
    PyInstaller.__main__.run(args)
    print("\n打包完成！")
    print(f"可执行文件位于: {os.path.join(BASE_DIR, 'dist', '入库清单核对系统.exe')}")

if __name__ == '__main__':
    import sys
    
    if '--clean' in sys.argv:
        clean_build()
    else:
        build_exe()
