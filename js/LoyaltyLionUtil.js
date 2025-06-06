// deps { ObserverLite, parseHTML, DomReadyPromise, GlobalCart } loaded globally

import { ModalBox } from "./ModalBox"

export class LoyaltyLionUtil {

  /* similar pattern to GlobalCart.js , see that for details */
  constructor(settings){
    window.LoyaltyLionUtilObserver$ = window.LoyaltyLionUtilObserver$ || new ObserverLite()
    return new Promise((resolve,reject) => {
      if(window.LoyaltyLionUtilSingleton){
        if(window.LoyaltyLionUtilObserver$.loaded){
          resolve(window.LoyaltyLionUtilSingleton)
        }else{  
          window.LoyaltyLionUtilObserver$.subscribe( () => {
            resolve(window.LoyaltyLionUtilSingleton)
          })
        }
      }else{
        if(!settings){
          window.LoyaltyLionUtilObserver$.subscribe( () => {
            resolve(window.LoyaltyLionUtilSingleton)
          })
        }else{
          window.LoyaltyLionUtilSingleton = this
          this.settings = settings
          this.ObserverLite = new ObserverLite()
          this.subscribe( () => {
            window.LoyaltyLionUtilObserver$.loaded = true
            window.LoyaltyLionUtilObserver$.next()
          })
          this.loadAPIPromise().then( () => {
            window.loyaltylion._customer =  window.loyaltylion.customer
            this.loyaltylion = window.loyaltylion
            resolve(window.LoyaltyLionUtilSingleton)
            this.next()
          })
        }
      }
    })
  } 

  subscribe(callback) {
    return this.ObserverLite.subscribe(callback)
  }

  next(data) {
    this.ObserverLite.next(data)
  }

  loadAPIPromise(){
    return new Promise( (resolve,reject) => {
      if(window.loyaltylion.ui){
        resolve()
      }else{
        window.loyaltylion.on('ready', () => {
          resolve()
        })
      }
    })
  }

  get rewards(){
    const {program,_customer} = this.loyaltylion
    // get only the "flat" rewards e.g. £x off, define which ones are active and then which one is current
    let rewards = JSON.parse(JSON.stringify(program.rewards)).filter( ({discount_type,kind}) => discount_type == 'flat' && kind == 'cart_discount_voucher')
    rewards.unshift({
      discount_amount:0,
      point_cost:0
    })
    rewards = rewards.map( (reward) => {
      reward.point_cost = reward.discount_amount * 10
      reward.active = _customer? _customer.pointsRedeemable >= reward.point_cost : false
      return reward
    }).sort((a,b) => a.point_cost - b.point_cost )
    
    if(_customer){
      const currentPointsTierIndex = rewards.filter(({active}) => active).length - 1
      if(currentPointsTierIndex >= 0){
        rewards[currentPointsTierIndex].current = true
      }
    }
    return rewards
  }
  
  addOneYearToDate(inputDate) {
    const dateObject = new Date(inputDate);
    dateObject.setFullYear(dateObject.getFullYear() + 1);
    const day = dateObject.getDate().toString().padStart(2, '0');
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObject.getFullYear();
    return `${day}/${month}/${year}`;
  }

  
  showReward(claimedReward_id){
    claimedReward_id = parseInt(claimedReward_id)
    const claimedReward = this.loyaltylion.customer.claimedRewards.find(({id}) => id == claimedReward_id)
    let message = `Copy the code by clicking on the button below. You can view your reward vouchers at any time from ‘Your Available Awards’ section on this page. `
    const rewardModal = new ModalBox({
      content:`
        <div class="ll-modal-content tac bg-white flex flex-grid column-nowrap align-center justify-center">
          <h2 class="h-style h-style--accent t-xl">Get Your Code?</h2>
          <div class="rte-content lh-r t-m">
            <p>${message}</p>
          </div>
          <div class="ll-modal-content__code">${claimedReward.redeemable.code}</div>
          <button data-code="${claimedReward.redeemable.code}"
                  class="js-copy-code-btn btn btn--large">Copy Code</button>
        </div>
      `
    })
    rewardModal.subscribe( ({type}) => {
      if(type == 'open:rendered'){
        rewardModal.wrapper.querySelector('.js-copy-code-btn').addEventListener( 'click' , (e) => {
          e.preventDefault()
          const btn = e.currentTarget
          const text = btn.innerText
          btn.innerText = 'Copied'
          navigator.clipboard.writeText(btn.dataset.code)
          setTimeout(() => {
            btn.innerText = text
          },2000)
          
        })
      }
    })
    rewardModal.open()
  }

  claimReward(reward_id){
    return new Promise((resolve,reject) => {
      reward_id = parseInt(reward_id)
      const reward = this.loyaltylion.program.rewards.find(({id}) => id == reward_id)
      console.log('reward', reward)
      let message = `Swap {{points}} points for this rewards voucher? We recommend converting your points into a reward voucher once you’re ready to make a purchase.`
      message = message.replace('{{points}}' , reward.point_cost)
      let sub_message = `{{min_spend}} minimum spend after reward voucher has been applied`
      sub_message = sub_message.replace('{{min_spend}}' , `${this.settings.currencySymbol}${reward.minimum_spend - reward.discount_amount}`)
      const confirmModal = new ModalBox({
        content:`
          <div class="ll-modal-content tac bg-white flex flex-grid column-nowrap align-center justify-center">
            <h2 class="h-style h-style--accent t-xl">${reward.title}</h2>
            <div class="rte-content lh-r t-m">
              <p>${message}</p>
              <p class="t-s">${sub_message}</p>
            </div>
            <button class="js-confirm-claim-btn btn btn--large">Redeem Points</button>
          </div>
        `
      })
      // wait for the content of the modal to load and then attatch click event to the button
      confirmModal.subscribe( ({type}) => {
        if(type == 'open:rendered'){
          confirmModal.wrapper.querySelector('.js-confirm-claim-btn').addEventListener( 'click' , (e) => {
            e.preventDefault()
            e.currentTarget.classList.add('btn--loading')
            const {api} = this.loyaltylion
            const params = {
              method: 'POST',
              headers: { ...api.http.headers, ...{'Content-Type': 'application/json'} },
              body:JSON.stringify({
                reward_id:reward_id
              })
            }
            fetch(`${api.http.baseUrl}/v2/rewards/claim`,params)
            .then( (response) => response.json())
            .then(data => {
              const {action,claimed_reward:claimedReward} = data
              const {pointsApproved, pointsTotal, pointsSpent} = data.customer
              this.loyaltylion._customer.actions.unshift(action)
              this.loyaltylion._customer.claimedRewards.unshift(claimedReward)
              this.loyaltylion._customer = { ...this.loyaltylion.customer , ...{
                pointsRedeemable:pointsApproved,
                pointsTotal:pointsTotal,
                pointsSpent:pointsSpent
              }}
              resolve(claimedReward)
              this.next()
            })
            .catch(err => {
              console.log(err)
              reject(err)
            })
          })
        }
        if(type == 'close:finish'){
          confirmModal.destroy()
        }
      })
      confirmModal.open()
    })
  }

}