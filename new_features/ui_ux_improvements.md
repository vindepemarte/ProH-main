# UI/UX Improvements

## Overview
Enhance the user interface and experience with various improvements to badges, calendar components, and modals.

## Tasks

### Beta Badge Implementation
- [ ] Add 'Beta' badge to navbar
- [ ] Implement circular animation effect around badge on desktop like this : /* From Uiverse.io by Spacious74 */ 
.button {
  cursor: pointer;
  font-size: 1.4rem;
  border-radius: 16px;
  border: none;
  padding: 2px;
  background: radial-gradient(circle 80px at 80% -10%, #ffffff, #181b1b);
  position: relative;
}
.button::after {
  content: "";
  position: absolute;
  width: 65%;
  height: 60%;
  border-radius: 120px;
  top: 0;
  right: 0;
  box-shadow: 0 0 20px #ffffff38;
  z-index: -1;
}

.blob1 {
  position: absolute;
  width: 70px;
  height: 100%;
  border-radius: 16px;
  bottom: 0;
  left: 0;
  background: radial-gradient(
    circle 60px at 0% 100%,
    #3fe9ff,
    #0000ff80,
    transparent
  );
  box-shadow: -10px 10px 30px #0051ff2d;
}

.inner {
  padding: 14px 25px;
  border-radius: 14px;
  color: #fff;
  z-index: 3;
  position: relative;
  background: radial-gradient(circle 80px at 80% -50%, #777777, #0f1111);
}
.inner::before {
  content: "";
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  border-radius: 14px;
  background: radial-gradient(
    circle 60px at 0% 100%,
    #00e1ff1a,
    #0000ff11,
    transparent
  );
  position: absolute;
}

- [ ] Position badge under 'Welcome <Role>' text on mobile view
- [ ] Ensure responsive design across device sizes

### Calendar Component Enhancement
- [ ] Add 'Done' button to confirm date selection
- [ ] Modify calendar to only close after explicit confirmation
- [ ] Improve UI/UX for better desktop and mobile experience
- [ ] Ensure consistent styling with rest of application

### Modal Improvements
- [ ] Make Terms and Conditions modal scrollable
- [ ] Make Privacy Policy modal scrollable
- [ ] Ensure proper scroll behavior on all device sizes

## Implementation Strategy

1. Create a Beta badge component and add it to the navbar
2. Modify the calendar component to include a confirmation button
3. Update the modal components to ensure proper scrolling behavior
4. Test all UI changes across different device sizes