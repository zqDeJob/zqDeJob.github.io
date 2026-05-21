基本的开发环境要有：

- git
- node

git 安装很简单，直接去官方下载对应版本就好，地址：[Git - Install](https://git-scm.com/install/)

但是node 的安装有讲究，1 是版本有很多，开发过程中可能会频繁切换node版本，2 是node下载的源多在国外，下载大部分情况会失败。

所以这又用到了两个工具nvm和nrm。

1.nvm用来切换node的版本。安装地址 ：[开始 下载nvm - nvm中文官网](https://nvm.uihtm.com/doc/download-nvm.html)

linux 环境下：

nvm 安装方式推荐如下：（如果网络不畅，可以使用国内替代的地址）

```
#官网
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# 国内替代
curl -o- https://gitee.com/RubyMetric/nvm-cn/raw/main/install.sh | bash
# 然后执行下面的两条命令即可
chmod +x ~/.nvm/nvm.sh
source ~/.bashrc
```

windows环境麻烦点：

如果 nvm install lts 一直失败，应该就是网络问题，去nvm安装目录找到settings.txt文件（比如： `F:\nvm\nvm\settings.txt`）更新内容：

```
root: F:\nvm\nvm

path: F:\nodejs

node_mirror: https://npmmirror.com/mirrors/node/

npm_mirror: https://npmmirror.com/mirrors/npm/
```

## **同时windows环境往往还需要修改环境变量（如 nvm 命令不可用）**

在系统环境变量中确认：


| **变量**        | **建议值**                           |
| ------------- | --------------------------------- |
| `NVM_HOME`    | `F:\nvm\nvm`                      |
| `NVM_SYMLINK` | `F:\nodejs`                       |
| `Path`        | 包含 `%NVM_HOME%` 和 `%NVM_SYMLINK%` |




2.nrm 是用来切换代理地址，下载很简单

```
npm i -g nrm
```

相关命令

```
nrm ls // 查看源头
nrm use taoabo // 使用源
```

