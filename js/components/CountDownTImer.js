export class CountdownTimer extends HTMLElement {
  constructor() {
    super();
    this.runoutHide = this.getAttribute("runout-hide") === "true";
    this.epochEndTime = Math.floor(Date.parse(this.getAttribute("target-date")) / 1000);
  }

  connectedCallback() {
    DomReadyPromise()
      .then(() => {
        this.render();
        this.startCountdown();
      })
      .catch((err) => console.error("Error initializing CountdownTimer:", err));
  }

  render() {
    this.daysSpan = this.querySelector(".days");
    this.hoursSpan = this.querySelector(".hours");
    this.minutesSpan = this.querySelector(".minutes");
    this.secondsSpan = this.querySelector(".seconds");
    this.colonElements = this.querySelectorAll(".colon");
  }

  getTimeRemaining(epochEndTime) {
    // Current time in epoch seconds (UTC)
    const nowUTC = Math.floor(Date.now() / 1000); 

    // Remaining time in seconds
    const total = epochEndTime - nowUTC; 

    // Convert remaining seconds into days, hours, minutes, and seconds
    const days = Math.floor(total / (60 * 60 * 24));
    const hours = Math.floor((total % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((total % (60 * 60)) / 60);
    const seconds = total % 60;

    return {
      total,
      days,
      hours,
      minutes,
      seconds,
    };
  }

  startCountdown() {
    const zeroFill = (num) => (num < 10 ? `0${num}` : num);

    const updateCountdown = () => {
      const timeRemaining = this.getTimeRemaining(this.epochEndTime);

      if (timeRemaining.total <= 0) {
        if (this.runoutHide) {
          this.style.display = "none";
        } else {
          this.daysSpan.textContent = `00d`;
          this.hoursSpan.textContent = `00h`;
          this.minutesSpan.textContent = `00m`;
          this.secondsSpan.textContent = `00s`;
        }
        clearInterval(this.interval);
        return;
      }

      this.daysSpan.textContent = `${zeroFill(timeRemaining.days)}d`;
      this.hoursSpan.textContent = `${zeroFill(timeRemaining.hours)}h`;
      this.minutesSpan.textContent = `${zeroFill(timeRemaining.minutes)}m`;
      this.secondsSpan.textContent = `${zeroFill(timeRemaining.seconds)}s`;
    };

    updateCountdown();

    this.interval = setInterval(updateCountdown, 1000);
  }

  disconnectedCallback() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

customElements.define("countdown-timer", CountdownTimer);
