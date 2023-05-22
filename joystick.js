class Joystick {
    constructor(container) {
      this.container = container;
      this.handle = container.querySelector(".joystick-handle");
      this.centerX = container.offsetWidth / 2;
      this.centerY = container.offsetHeight / 2;
      this.maxDistance = container.offsetWidth / 2 - this.handle.offsetWidth / 2;
      this.isMoving = false;
      this.currentAngle = 0;
      this.currentDistance = 0;
      this.moveCallback = null;
  
      this.bindEvents();
    }
  
    bindEvents() {
      this.handle.addEventListener("mousedown", this.startMove.bind(this));
      document.addEventListener("mousemove", this.move.bind(this));
      document.addEventListener("mouseup", this.endMove.bind(this));
      this.handle.addEventListener("touchstart", this.startMove.bind(this));
      document.addEventListener("touchmove", this.move.bind(this));
      document.addEventListener("touchend", this.endMove.bind(this));
      document.addEventListener("touchcancel", this.endMove.bind(this));
    }
  
    startMove(event) {
      event.preventDefault();
      this.isMoving = true;
    }
  
    move(event) {
      if (!this.isMoving) return;
  
      const { clientX, clientY } = event.touches ? event.touches[0] : event;
      const rect = this.container.getBoundingClientRect();
      const x = clientX - rect.left - this.centerX;
      const y = clientY - rect.top - this.centerY;
  
      const angle = Math.atan2(y, x);
      const distance = Math.min(Math.hypot(x, y), this.maxDistance);
  
      this.setPosition(angle, distance);
  
      if (this.moveCallback) {
        this.moveCallback(this.currentAngle, this.currentDistance);
      }
    }
  
    endMove() {
      this.isMoving = false;
      this.setPosition(0, 0);
    }
  
    setPosition(angle, distance) {
      this.currentAngle = angle;
      this.currentDistance = distance;
  
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
  
      this.handle.style.transform = `translate(${x}px, ${y}px)`;
    }
  
    onMove(callback) {
      this.moveCallback = callback;
    }
  }
  
  function joystickMoveListener() {
    const joystickContainer = document.querySelector(".joystick-container");
    const joystick = new Joystick(joystickContainer);
  
    joystick.onMove((angle, distance) => {
      // Calculate x and y changes based on the angle
      let xChange = 0;
      let yChange = 0;
  
      if (angle >= 45 && angle < 135) {
        yChange = -1; // Up
      } else if (angle >= 135 && angle < 225) {
        xChange = -1; // Left
      } else if (angle >= 225 && angle < 315) {
        yChange = 1; // Down
      } else {
        xChange = 1; // Right
      }
  
      // Call the handleArrowPress function with the calculated changes
      handleArrowPress(xChange, yChange);
    });
  }
  