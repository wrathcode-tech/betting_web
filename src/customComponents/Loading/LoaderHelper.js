const LoaderHelper = {
  _loaderRef: null,

  setLoader(ref) {
    this._loaderRef = ref;
  },

  show() {
    if (this._loaderRef?.current) {
      this._loaderRef.current.show();
    }
  },

  hide() {
    if (this._loaderRef?.current) {
      this._loaderRef.current.hide();
    }
  },
};

export default LoaderHelper;
