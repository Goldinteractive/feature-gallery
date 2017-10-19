import PhotoSwipe from 'photoswipe'
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default'

let COUNTER_GALLERY = 0

const SELECTOR_PSWP = '[data-pswp]'
const SELECTOR_FIGURE = '[data-figure]'
const SELECTOR_SOURCE = '[data-source]'
const SELECTOR_WIDTH = '[data-width]'
const SELECTOR_HEIGHT = '[data-height]'
const SELECTOR_THUMBNAIL = '[data-thumbnail]'
const SELECTOR_CAPTION = '[data-caption]'

const ATTR_PSWP_UID = 'data-pswp-uid'

/**
 * Gallery feature class.
 */
class Gallery extends base.features.Feature {

  init() {
    this.options.galleryUID = COUNTER_GALLERY++

    this._initPswpElement()
    this.update()

    this.node.setAttribute(ATTR_PSWP_UID, this.options.galleryUID)
    this.addEventListener(this.node, 'click', this._clickThumbnailListener())

    this._openByHash()
  }

  update() {
    this._parseFigures()
  }

  open(index, disableAnimation = false, fromUrl = false) {
    let options = Object.assign({}, this.options)

    if (options.getThumbBoundsFn) {
      options.getThumbBoundsFn = options.getThumbBoundsFn.bind(this)
    }

    if (disableAnimation) {
      options.showAnimationDuration = 0
    }

    if (fromUrl) {
      if (options.galleryPIDs) {
        let i = this.items.length
        // parse real index when custom PIDs are used
        // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
        while (i--) {
          if (this.items[i].pid == index) {
            options.index = i
            break
          }
        }
      } else {
        // in URL indexes start from 1
        options.index = parseInt(index, 10) - 1
      }
    } else {
      options.index = parseInt(index, 10)
    }

    // exit if index no valid index
    if (isNaN(options.index)) {
        return
    }

    this.photoSwipe = new PhotoSwipe(this.$pswpElement, PhotoSwipeUI_Default, this.items, options)
    this.photoSwipe.init()
  }

  _parseFigures() {
    this.items = []
    this.$$figures = this.$$(SELECTOR_FIGURE)

    this.$$figures.forEach(($figure) => {
      let $source = base.utils.dom.$(SELECTOR_SOURCE, $figure)
      let $width = base.utils.dom.$(SELECTOR_WIDTH, $figure)
      let $height = base.utils.dom.$(SELECTOR_HEIGHT, $figure)
      let $thumbnail = base.utils.dom.$(SELECTOR_THUMBNAIL, $figure)
      let $caption = base.utils.dom.$(SELECTOR_CAPTION, $figure)

      let item = {
        src: $source.getAttribute('href'),
        w: parseInt($width.getAttribute('content'), 10),
        h: parseInt($height.getAttribute('content'), 10),
        elements: {
          $source, $width, $height, $thumbnail, $caption
        }
      }

      if ($caption) {
        item.title = $caption.getAttribute('content') || $caption.textContent.trim()
      }

      if ($thumbnail) {
        item.msrc = $thumbnail.getAttribute('src')
      }

      this.items.push(item)
    })
  }

  _openByHash() {
    let hash = base.utils.url.hash()

    if (hash) {
      let data = base.utils.url.parseQuery(hash)

      if (data.pid && data.gid == this.options.galleryUID) {
        this.open(data.pid, true, true)
      }
    }
  }

  _initPswpElement() {
    this.$pswpElement = base.utils.dom.$(SELECTOR_PSWP)

    if (!this.$pswpElement) {
      throw new Error(`The ${SELECTOR_PSWP} element is missing!`)
    }
  }

  _clickThumbnailListener() {
    return (e) => {
      e.preventDefault()
      let $clickedListItem = e.target.closest(SELECTOR_FIGURE)

      if (!$clickedListItem) {
        return
      }

      let index = base.utils.dom.index($clickedListItem)
      this.open(index)
    }
  }

  destroy() {
    this.node.removeAttribute(ATTR_PSWP_UID)

    if (this.photoSwipe) {
      this.photoSwip.destroy()
    }

    super.destroy()
  }

}

/**
 * Default feature options.
 */
Gallery.defaultOptions = {
  closeEl: true,
  captionEl: true,
  fullscreenEl: false,
  zoomEl: true,
  shareEl: false,
  counterEl: true,
  arrowEl: true,
  preloaderEl: true,
  bgOpacity: 0.9,
  showHideOpacity: true,
  getThumbBoundsFn: function(index) {
    let $thumbnail = this.items[index].elements.$thumbnail
    let rect = $thumbnail.getBoundingClientRect()

    return {
      x: rect.left,
      y: rect.top + base.utils.dom.scrollY(),
      w: rect.width
    }
  },
  shareButtons: [
    { id: 'facebook', label: 'Teile auf Facebook', url: 'https://www.facebook.com/sharer/sharer.php?u={{url}}' },
    { id: 'twitter', label: 'Teile auf Twitter', url: 'https://twitter.com/intent/tweet?text={{text}}&url={{url}}' },
    { id: 'google', label: 'Teile auf Google', url: 'https://plus.google.com/share?url={{url}}' },
    { id: 'download', label: 'Download', url: '{{raw_image_url}}', download: true }
  ]
}

export default Gallery
