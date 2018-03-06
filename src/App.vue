<template>
    <div>
        <div class="app2">
            <header>
                Minpic for Mac
            </header>
            <section @click="openFile" class="drag">

                <ul class="img-wrapper">
                    <li class="item" v-for="item in data">
                        <div class="item-wrap" style="display:flex;height:48px;">
                            <div class="item-img" :style="item.style"></div>
                            <div class="aab" style="margin-left:10px;">
                                <p style="color:#fff;padding-top:4px;font-size:14px;">{{item.basename}}</p>
                                <p v-if="item.status === 'success'" style="color:#6defc9;font-size:12px;">
                                    <span>-{{((item.inputSize - item.outputSize) / 1000).toFixed(2)}}k</span>
                                    <span>({{((1 - item.outputSize / item.inputSize) * 100).toFixed(1)}}%)</span>
                                </p>
                                <p v-if="item.status === 'processIng'" style="color:#a1d3e9;font-size:12px;">处理中</p>
                                <p v-if="item.status === 'error'" style="color:rgb(223, 85, 85);font-size:12px;">失败</p>
                            </div>
                        </div>
                        <!-- 下载完成 -->
                        <div v-if="item.status === 'success'" class="circle"></div>
                        <div v-if="item.status === 'processIng'" class="circleProgress_wrapper">
                            <div class="wrapper right">
                                <div :style="{'-webkit-transform' : 'rotate(' + (45 + item.progressUpload * 180) + 'deg)'}" class="circleProgress rightcircle"></div>
                            </div>
                            <div class="wrapper left">
                                <div :style="{'-webkit-transform' : 'rotate(' + (45 + item.progressDownload * 180) + 'deg)'}" class="circleProgress leftcircle"></div>
                            </div>
                        </div>
                    </li>
                </ul>
                <!-- <p>拖拽PNG/JPG文件到这里!</p> -->
            </section>
            <section style="box-shadow:0px 8px 8px rgba(0,0,0,0.2);position:relative;z-index:999;display:flex;justify-content:space-between;padding:0 12px;">
                <p>0个任务</p>
                <div>
                    <img style="width:20px;height:20px;cursor:pointer;margin-right:10px;" src="src/image/folder.png" />
                    <img @click="changeSize" style="width:20px;height:20px;cursor:pointer;" src="src/image/icon_settings.png" />
                </div>
            </section>
        </div>
        <footer style="position:relative">
            <p @click="keylist.push({key:''})">+</p>
            <div>
                <label>API key</label>
                <ul>
                    <li v-for="(item, index) in keylist">
                        <input v-model="item.key" class="api_key" type="text" />
                        <span v-if="index != 0" @click="keylist.splice(index, 1)">-----</span>
                    </li>
                </ul>
            </div>
        </footer>
    </div>
</template>
<script>
    import {
        ipcRenderer
    } from 'electron'
    import $ from 'jquery'
    const {
        IMAGE_STATUS
    } = require('../const.js')
    export default {
        data() {
            return {
                data: [],
                keylist: [],
                setBtn: false
            }
        },
        mounted() {
            let self = this;
            document.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                let json = [];
                for (let f of e.dataTransfer.files) {
                    console.log('File(s) you dragged here: ', f.path)
                    json.push(f.path)
                }
                ipcRenderer.send('open-file', json)
            });
            document.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });

            ipcRenderer.on('getKey', (event, arg) => {
                this.$set(self, 'keylist', arg || [{
                    key: ''
                }]);
            });

            /**
             * 某张图片上传中
             */
            ipcRenderer.on('push', (event, arg) => {
                const index = getIndex(arg.id);
                const item = getItem(index);
                this.$set(self.data, index, Object.assign(item, arg));
                console.log(arg)
            });

            ipcRenderer.on('getImageList', (event, arg) => {
                arg.forEach(item => {
                    item.style = {
                        'background-image': `url(${item.path})`,
                        'background-size': (item.width < 48 && item.height < 48) ? 'auto' : 'contain'
                    }
                });
                this.data.push(...arg);
            });

            function getIndex(id) {
                const index = self.data.findIndex((item) => {
                    return item.id == id
                });
                return index;
            };

            function getItem(index) {
                return self.data[index];
            };

            $(document).on('input', '.api_key', () => {
                console.log(self.keylist)
            });
        },
        methods: {
            openFile() {
                ipcRenderer.send('open-file')
            },
            changeSize() {
                ipcRenderer.send('windowsChangeSize', {
                    width: 320,
                    height: !this.setBtn ? 397 : 297
                })
                this.setBtn = !this.setBtn;
            }
        },
        watch: {
            keylist: {
                handler: function () {
                    ipcRenderer.send('setKey', this.keylist)
                },
                deep: true
            }
        }
    }

</script>
