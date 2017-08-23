class App {
    constructor() {
        this.initServiceWorker();
        this.game = new Game('area');
    }
    initServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            return;
        }
        navigator.serviceWorker.register('./sw.js');
        navigator.serviceWorker.ready.then((registration) => {
        }).catch((error) => { console.log(error); });
    }
}
const COLOR_MAX = 4;
class Game {
    constructor(area) {
        this.area = document.getElementById(area);
        this.blocks = new Blocks(this.area, 6, 6);
        const startButton = document.getElementById('start');
        if (startButton) {
            startButton.addEventListener('click', () => { this.start(); }, false);
        }
        else {
            this.start();
        }
        const refreshButton = document.getElementById('refresh');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => { this.refresh(); }, false);
        }
    }
    start() {
        this.blocks.start();
    }
    refresh() {
        this.blocks.clearData();
        location.reload();
    }
}
class Blocks {
    constructor(element, width, height) {
        this.blocks = [];
        this.element = element;
        this.width = width;
        this.height = height;
        this.clean();
    }
    clean() {
        this.blocks.forEach((block) => { this.remove(block); });
        this.blocks = [];
        this.sort();
        const colors = this.load(this.width * this.height);
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                const block = new Block(this, x, this.calcY((y - this.height) * 2), colors[y * this.width + x]);
                this.blocks.push(block);
                this.add(block);
            }
        }
    }
    start() {
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                this.blocks[y * this.width + x].setY(y);
            }
        }
        this.sort();
    }
    sort() {
        this.blocks = this.blocks.filter((b) => { return !b.isDead(); });
        this.blocks.sort((a, b) => {
            return (a.getY() * this.width + a.getX()) - (b.getY() * this.width + b.getX());
        });
    }
    add(block) { this.element.appendChild(block.getElement()); }
    remove(block) { this.element.removeChild(block.getElement()); }
    blockWidth() { return 'calc(100%/' + this.width + ')'; }
    blockHeight() { return 'calc(100%/' + this.height + ')'; }
    calcX(x) { return 'calc(' + x + '*100%/' + this.width + ')'; }
    calcY(y) { return 'calc(' + y + '*100%/ ' + this.height + ')'; }
    getBlock(x, y) {
        if (x < 0 || this.width <= x || y < 0 || this.height <= y) {
            return null;
        }
        for (let i = 0; i < this.blocks.length; ++i) {
            if (this.blocks[i].existsPosition(x, y)) {
                return this.blocks[i];
            }
        }
        return null;
    }
    actionBlock(block) {
        this.chainBlocks(block.getX(), block.getY(), block.getColor());
        for (let x = 0; x < this.width; ++x) {
            let count = 0;
            for (let y = this.height - 1; 0 <= y; --y) {
                let block = this.getBlock(x, y);
                if (block) {
                    continue;
                }
                for (let y_ = y - 1; 0 <= y_; --y_) {
                    block = this.getBlock(x, y_);
                    if (block) {
                        break;
                    }
                }
                if (!block) {
                    block = new Block(this, x, this.calcY((++count) * -2), -1);
                    this.blocks.push(block);
                    this.add(block);
                }
                block.setY(y, 100);
            }
        }
        this.save();
    }
    chainBlocks(x, y, color) {
        const block = this.getBlock(x, y);
        if (!block || block.isDead() || block.getColor() != color) {
            return;
        }
        block.dead();
        this.chainBlocks(x + 1, y, color);
        this.chainBlocks(x - 1, y, color);
        this.chainBlocks(x, y + 1, color);
        this.chainBlocks(x, y - 1, color);
    }
    save() {
        this.sort();
        if (!window.localStorage) {
            return;
        }
        window.localStorage.setItem('blocks', this.blocks.map((b) => { return b.getColor(); }).join(''));
    }
    load(length) {
        const colors = (window.localStorage ? window.localStorage.getItem('blocks') || '' : '').split('').map((v) => { return parseInt(v); });
        while (colors.length < length) {
            colors.push(-1);
        }
        return colors;
    }
    clearData() {
        if (!window.localStorage) {
            return;
        }
        window.localStorage.clear();
    }
}
class Block {
    constructor(parent, x, y, color) {
        this.x = this.y = -1;
        this.parent = parent;
        this.element = document.createElement('div');
        this.setSize(parent.blockWidth(), parent.blockHeight());
        this.setPosition(x, y);
        this.setColor(color < 0 ? Math.floor(Math.random() * COLOR_MAX) : color);
        this.element.classList.add('block');
        this.element.addEventListener('click', (e) => { this.action(e); }, false);
    }
    action(e) {
        if (this.isDead()) {
            return;
        }
        this.parent.actionBlock(this);
    }
    setSize(w, h) {
        this.element.style.width = w;
        this.element.style.height = h;
    }
    setPosition(x, y) {
        this.setX(x);
        this.setY(y);
    }
    existsPosition(x, y) { return this.x === x && this.y === y; }
    getElement() { return this.element; }
    setX(x) {
        if (typeof x === 'number') {
            this.x = x;
            x = this.parent.calcX(x);
        }
        this.element.style.left = x;
    }
    setY(y, lazy = 0) {
        if (typeof y === 'number') {
            this.y = y;
            y = this.parent.calcY(y);
        }
        if (lazy <= 0) {
            this.element.style.top = y;
            return;
        }
        setTimeout(() => { this.element.style.top = y; }, lazy);
    }
    getX() { return this.x; }
    getY() { return this.y; }
    getColor() { return this.color; }
    setColor(color) {
        this.color = color;
        this.element.classList.add('color' + color);
    }
    isDead() { return this.x < 0 || this.y < 0; }
    dead() {
        this.x = this.y = -1;
        this.parent.remove(this);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
