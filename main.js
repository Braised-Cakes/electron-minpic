const electron = require('electron')
const app = electron.app
const fs = require('fs')
const request = require('request')
const progress = require('request-progress')
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const md5 = require('md5')
const glob = require('glob')
const sizeOf = require('image-size')
const tinify = require("tinify")
const {
	IMAGE_STATUS
} = require('./const.js')
let win
let minList = []; //图片列表
let minIndex = 0;
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync(path.resolve(app.getPath('home'), 'electron-minpic.json'))
const db = low(adapter)
const is_dev = true;

electron.ipcMain.on('setKey', (event, arg) => {
	db.set('list', arg)
		.write();
	if (arg.length == 1 || !arg.find((item) => {
			return db.get('now').value() == item.key
		})) {
		db.set('now', arg[0].key)
			.write()
	}
});


electron.ipcMain.on('windowsChangeSize', (event, arg) => {
	win.setContentSize(arg.width, arg.height);
});


function createWindow() {

	win = new BrowserWindow({
		transparent: is_dev ? true : false,
		titleBarStyle: is_dev ? 'hidden' : 'default',
		frame: is_dev ? false : true,
		width: is_dev ? 320 : 500,
		height: is_dev ? 297 : 500,
		icon: '/Users/BraisedCakes/Desktop/tinypng_output/git_white.png',
		webPreferences: {
			devTools: is_dev ? false : true
		}
	})
	// win.devTools
	win.setResizable(is_dev ? false : true)
	win.openDevTools();
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))
	win.webContents.on('did-finish-load', () => {
		win.webContents.send('getKey', db.get('list').value())
	})

	win.on('closed', function () {
		win = null
	})

}
app.on('ready', createWindow)
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	if (win === null) {
		createWindow()
	}
})



function imageDone() {
	minIndex++;
	if (minIndex == minList.length) {
		//如果所有队列均执行完毕，则调取系统通知
		new electron.Notification({
			title: 'electron-minpic',
			body: '队列处理完成'
		}).show()
	}
}


electron.ipcMain.on('open-file', (event, source) => {
	if (!source) {
		source = electron.dialog.showOpenDialog({
			properties: ['openFile', 'openDirectory', 'multiSelections']
		})
	}
	if (!source) return
	source.forEach((item) => {
		if (fs.statSync(item).isDirectory()) {
			minList.push(...glob.sync(path.resolve(item, '**/*.@(jpg|png|jpeg)')))
		} else if (/(png|jpg|jpeg)$/.test(item)) {
			minList.push(item)
		}
	});
	minList = minList.map((item) => {
		if (typeof item == 'object') {
			return item
		} else {
			return {
				path: item,
				basename: path.basename(item),
				id: md5(item),
				width: sizeOf(item).width,
				height: sizeOf(item).height,
				status: IMAGE_STATUS.processIng
			}
		}
	});
	win.webContents.send('getImageList', minList)
	tinify.key = db.get('now').value();
	minList.forEach((item) => {
		let inputSize = fs.statSync(item.path).size;
		let image = tinify.fromFile(item.path)
		console.log('开始下载')
		image.toFile(item.path, err => {
			if (err) {
				win.webContents.send('push', {
					id: item.id,
					status: IMAGE_STATUS.error
				})
				console.log('下载失败');
				return;
			}
			let outputSize = fs.statSync(item.path).size;
			console.log('下载成功');
			win.webContents.send('push', {
				id: item.id,
				status: IMAGE_STATUS.success,
				progressDownload: 1,
				inputSize: inputSize,
				outputSize: outputSize
			});
			imageDone();
		});
	});
})