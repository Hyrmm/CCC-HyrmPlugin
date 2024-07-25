const { messages } = require("../main")

Editor.Panel.extend({
  style: `
    :host {
      margin: 10px;
    }
    .scroll {
      overflow-y: scroll;
      height: 400px;
    }
  `,

  template: `
    <div class="scroll">
      <h4><i class="icon-menu"></i>文件监听</h3>
      <ui-box-container>
        <ui-prop name="监听间隔">
          <ui-input :value="watchInterval" @change="watchIntervalChange" type="number" class="flex-1"></ui-input>
        </ui-prop>
      </ui-box-container>

      <h4><i class="icon-menu"></i>Spine预览</h3>
      <ui-box-container>
        <ui-prop name="自动开启">
          <ui-checkbox :checked="spineAutoPreview" @change="spineAutoPreviewChange" class="flex-1"></ui-checkbox>
        </ui-prop>
      </ui-box-container>

      <h4><i class="icon-menu"></i>节点排序</h3>
      <ui-box-container>
        <ui-prop name="排序回调">
          <ui-input :value="sortCallback" @change="sortCallbackChange" type="number" class="flex-1"></ui-input>
        </ui-prop>
        <ui-section>
          <!-- ui-section 头部区域 -->
          <div class="header">参考举例</div>
          <!-- ui-section 子代内容区域 -->
          <ui-markdown> 
          > 有一组待排序的节点，节点名称以数字递增的规则，通过名称排序:

          \`\`\`js
          function(node1,node2){
            return Number(node1.name)-Number(node2.name)
          }
          \`\`\`

          > 有一组待排序的节点，节点的子节点个数不同，通过子节点数量排序：

          \`\`\`js
          function(node1,node2){
            return Number(node1.children.length)-Number(node2.name.length)
          }
          \`\`\`
        </ui-markdown>
        </ui-section>
        

      </ui-box-container>

      <h4><i class="icon-menu"></i>文件监听</h3>
      <ui-box-container>
      </ui-box-container>
    </div>
    <div style="width:100%;height:100px;"></div>
    <div style="margin-top: 10px;display: flex;justify-content: center;width:100%;position:absolute;bottom:10px;">
      <ui-button @confirm="saveSetting" class="green" style="width: 280px;height:30px;">保存</ui-button>
    </div>

  `,

  ready() {
    let globalSetting = null
    new window.Vue({
      el: this.shadowRoot,

      created() {
        Editor.Ipc.sendToMain("hyrm-plugin:panel/get-setting", "get-setting", function (err, setting) {
          globalSetting = setting
          this.watchInterval = setting.watchInterval
          this.sortCallback = setting.sortCallback
          this.spineAutoPreview = setting.spineAutoPreview
        }.bind(this))

      },

      data: {
        watchInterval: 0,
        sortCallback: "",
        spineAutoPreview: false
      },

      methods: {

        saveSetting() {
          globalSetting.watchInterval = Number(this.watchInterval)
          globalSetting.sortCallback = this.sortCallback
          globalSetting.spineAutoPreview = this.spineAutoPreview
          Editor.Ipc.sendToMain("hyrm-plugin:panel/save-setting", "save-setting", globalSetting, function (err, setting) {
            alert("保存成功")
          })
        },

        watchIntervalChange(event) {
          this.watchInterval = event.detail.value
        },

        sortCallbackChange(event) {
          this.sortCallback = event.detail.value
        },

        spineAutoPreviewChange(event) {
          this.spineAutoPreview = event.detail.value
        }
      }
    })
  },

  messages: {

  }
})