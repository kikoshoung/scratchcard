Scratchcard
===========

A scratch card library based on canvas.

***Options
```js
defaults: {
    // A wrapper element for scratch card, must be an original dom object
    container: null,

    // Image src for win or not
    imgSrc: '',

    // Card size, [{width}, {height}]
    size: [240, 180],

    // Valid scratch area, [{left}, {top}, {width}, {hight}]
    // Defaults to [0, 0, {cardWidth}, {cardHeight}]
    validArea: [0, 0, {cardWidth}, {cardWidth}],

    // Percentage of valid scratched pixels, based on valid area
    percentage: 0.6,

    // Scratch layer's property
    scratchLayer: {
        background: '#e0e0e0',
        text: '刮开此涂层',
        color: '#888',
        font: '30px Verdana',

        // Scratch width
        lineWidth: 30,
    },

    // Text to show when users' browser does not support canvas
    notSupportText: 'Sorry, your browser dose not support [Canvas], please use a higher version browser and try again.',

    // A callback function, invoked after a scratch action
    onScratch: null,

    // A callback function, invoked when scratch completed
    onComplete: null,
}
```

See it's demo and doc <a target="_blank" href="http://kikoshoung.me/#scratch-card">here</a>.

