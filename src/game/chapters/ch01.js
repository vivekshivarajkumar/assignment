// Chapter 1 · Morning: the alarm (ch01-wake.js), brushing teeth
// (ch01-brush.js), the train to work (ch01-commute.js) and the office
// (ch01-office.js). The camera pans
// from one to the next through a flip clock that keeps ticking on.
import wakeUp from './ch01-wake.js'
import brushTeeth from './ch01-brush.js'
import commute from './ch01-commute.js'
import officeWork from './ch01-office.js'

export default {
  title: 'Morning',
  pages: [wakeUp, brushTeeth, commute, officeWork],
}
