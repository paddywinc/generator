import Component from "gia/Component";

export default class ${rawComponentName} extends Component {

 constructor(element) {
    super(element);

    this.options = {
    };

    this.ref = {
      single: null, // looks for single element
      multiple: [], // looks for multiple elements
    };
  }

  // add event listeners here
  mount() {
    console.log(this.element); // DOM element
    console.log(this.ref.single); // DOM element

    this.function();

    this.ref.single.addEventListener(
      "click",
      this.clickFunction.bind(this)
    );
  }

  function() {
  }

  clickFunction() {
  }

}