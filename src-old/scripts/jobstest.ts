/**
 * @id 0
 * @name jobstest
 * @desc Test jobs running (for use in cli only)
 * @author Patsagorn Y. (mpy@toolforge.org)
 * @license MIT
 */
console.log("emitted! 1");
// set timeout
setTimeout(() => {
  console.log("emitted! 2");
}, 20 * 1000);
