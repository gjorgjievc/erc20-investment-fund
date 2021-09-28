module.exports = (address) => {
    function truncate(text, startChars, endChars, maxLength) {
      if (text.length > maxLength) {
        var start = text.substring(0, startChars)
        var end = text.substring(text.length - endChars, text.length)
        return start + '....' + end
      }
      return text
    }
    const truncatedAddress = truncate(address, 5, 4, 8)
    return truncatedAddress
  }