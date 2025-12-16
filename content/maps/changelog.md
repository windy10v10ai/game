## 准备

复制`dota 2 beta\content\dota\maps\`目录的下列文件到`content\maps\`下

- dota.vmap
- prefabs\dota_pvp_prefab.vmap

使用Hammer编辑打开dota.vmap进行编辑

## 编辑中立生物

### 提升地图外围中立生物营地的等级

Pull Type从进到远

1. Fast/ Sorta Fast
2. Just Enough/ Small Lane Camp
3. Normal
4. Slow

- 对象
  - 天辉/夜魇的优势路/劣势路高低附近的中立生物营地
- 修改内容
  - Camp Type: Ancient
  - Min/Max spawn type 设置成和其他远古一致
  - Kobolds (E), Ogres (M), Centaurs (H), Drakes (A) - (Normal Gamerules)
  - Ghosts (E), Centaurs (M), Wildkin (H), Prowlers (A)

## 编译地图

在Hammer中按F9，选择Build。

## 替换地图特效（不朽庭院地图为例）

### 需要软件

[Source 2 Viewer](https://valveresourceformat.github.io/) 点击下载

相关文件

- dota 2 beta\game\dota\maps\dota_coloseum.vpk
- game/maps/dota.vpk (自己编译的地图文件)

### 操作

1. 使用Source 2 Viewer分别解包上述2文件
2. 将dota.vpk解包后的文件夹中的maps\dota\entities文件夹备份
3. 合并文件夹，以dota.vpk解包后的文件为底，用dota_coloseum的文件覆盖
4. 将备份的entities文件夹覆盖在合并后的文件夹中
5. 使用Source 2 Viewer将合并后的文件夹重新打包成VPK文件<br>

- 注意maps文件夹结构保持一致

合并后的文件命名为dota.vpk，替换game/maps/dota.vpk文件

如果在 addoninfo.txt 中设置了多个地图，按照以下方法制作相应的vpk文件

### 自定义模式地图

- 重命名dota.vmap为custom.vmap
- 第一次编译时，需要勾选Create minimap，build
- 移除编译生成的materials/overviews/custom.tga文件
- 修正content/materials/overviews/custom.vmat中的Texture为materials/overviews/dota.png
- dota.png文件从解包的materials/overviews/dota_psd.vtex中获取

注意 由于内部路径名发生变化，无法替换地图特效
