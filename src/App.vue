<style lang="scss" scoped>
    .app {
        background: linear-gradient(#24aad6, #197ab9);
        header {
            text-align: center;
            color: #fff;
            -webkit-app-region: drag;
        }
        main {
            .drag {
                display: flex;
                align-items: center;
                flex-direction: column;
                height: 250px;
                overflow: hidden;
                background-size: 100px 100px;
                cursor: pointer;
                .drag-image {
                    width: 125px;
                    height: 125px;
                    margin-top: 60px;
                    align-self: center;
                }
                p {
                    color: #4ea0cc;
                }
                .img-wrapper {
                    overflow: scroll;
                    width: 100%;
                    li {
                        display: flex;
                        padding: 0 20px;
                        height: 48px;
                        margin: 5px 0;
                        justify-content: space-between;
                        align-items: center;
                    }
                    img {
                        width: 48px;
                    }
                }

                .circle {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background-size: cover;
                }

                .circle img {
                    width: 100%;
                    height: 100%;
                }

                .item-img {
                    width: 48px;
                    height: 48px;
                    background-repeat: no-repeat;
                    background-position: 50% 50%;
                }

                .circleProgress_wrapper {
                    width: 16px;
                    height: 16px;
                    position: relative;
                    border: 1px solid #fff;
                    border-radius: 50%;
                }

                .circleProgress {
                    border: 8px solid #fff;
                    border-radius: 50%;
                    position: absolute;
                    top: 0;
                    -webkit-transform: rotate(45deg);
                }

                .wrapper {
                    width: 8px;
                    height: 16px;
                    position: absolute;
                    top: 0;
                    overflow: hidden;
                }

                .right {
                    right: 0;
                }

                .left {
                    left: 0;
                }

                .rightcircle {
                    border-top: 8px solid transparent;
                    border-right: 8px solid transparent;
                    right: 0;

                }

                .leftcircle {
                    border-bottom: 8px solid transparent;
                    border-left: 8px solid transparent;
                    left: 0;
                }
            }
        }
        footer {
            background: #fff;
            height: 200px;
            display: flex;
            justify-content: center;
        }

    }

</style>

<template>
    <div class="app">
        <header>
            Minpic for Mac
        </header>
        <main class="container">
            <div @click="openFile" class="drag">
                <img class="drag-image" v-if="data.length == 0" src="src/image/icon.png" />
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
                        <div v-if="item.status === 'success'" class="circle">
                            <img src="src/image/icon_finish.png" />
                        </div>
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
            </div>
            <div style="box-shadow:0px 8px 8px rgba(0,0,0,0.2);position:relative;z-index:999;display:flex;justify-content:space-between;padding:0 12px;">
                <p>0个任务</p>
                <div>
                    <img style="width:20px;height:20px;cursor:pointer;margin-right:10px;" src="src/image/folder.png" />
                    <img @click="changeSize" style="width:20px;height:20px;cursor:pointer;" src="src/image/icon_settings.png" />
                </div>
            </div>
        </main>
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
