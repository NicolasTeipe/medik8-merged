// deps [parseHTML,ObserverLite,DomReadyPromise] loaded globally

export class GlobalVideoThumbnail extends HTMLElement{
  constructor() {
    super();
  }

  connectedCallback() {
    DomReadyPromise().then( async () => {
      let template = this.querySelector(':scope > template')
      if(template){
        try{
          this.settings = JSON.parse(template.innerHTML)
        }
        catch(err){
          console.log(err)
        }
        template.remove()
        template = null
      }

      if(this.settings.video_id){
        this.style.cursor = 'pointer'
        this.dataset.hasVideo = true

        const video = `
          <iframe 
            src="https://www.youtube.com/embed/${this.settings.video_id}?enablejsapi=1" 
            title="${this.settings.video_description}"  
            allow="autoplay; encrypted-media">
          </iframe>`

        this.content = `
          <div class="v2-video-modal flex row-wrap align-stretch justify-center" data-loading>
            <button aria-label="close" class="modal-close modal-close-btn btn-reset"></button>
            <div class="block-12/12 block-fh block-rel" style="aspect-ratio: ${this.settings.video_aspect_ratio}">
              ${video}
            </div>
          </div>`

        this.addEventListener('click',(e) => {
          this.handleClick()
        })
      }
    }).catch(err => {
      console.log(err)
    })
  }

  playVideo(){
    if(this.settings.video_type == 'youtube'){
      this.videoIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
    }    
  }

  pauseVideo(){
    if(this.settings.video_type == 'youtube'){
      this.videoIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    }    
  }

  handleClick(){
    this.modal = this.modal || (
      new ModalBox({
        content:this.content,
        settings: {
          containerCloseButton: false,
          flexClass:'v2-video-modal-modalbox-flex',
        }
      })
    )

    this.modal.subscribe( ({type}) => {
      if(type == 'open:rendered'){
        const iframe = this.modal.contentWrapper.querySelector('iframe')
        iframe.onload = () => {
          this.videoIframe = iframe
          this.videoIframe.parentNode.removeAttribute('data-loading')
          this.playVideo()
        }

        setTimeout(() => {
          if (!this.videoIframe) {
            this.videoIframe = iframe;
            this.videoIframe.parentNode.removeAttribute('data-loading');
            this.playVideo();
          }
        }, 2000);
      }
      if(type == 'open' && this.videoIframe){
        this.playVideo()
      }
      if ((type == 'close') && this.videoIframe) {
        this.pauseVideo();
      }
    })

    this.modal.open()
  }
}


if (!customElements.get('global-video-thumbnail')) {
  customElements.define('global-video-thumbnail', GlobalVideoThumbnail)
}
