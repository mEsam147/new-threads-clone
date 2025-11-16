import { useState } from 'react'
import useShowToast from './useShowToast'

const usePreviewImg = () => {
  const [imgUrl, setImgUrl] = useState(null)
  const [imgUrls, setImgUrls] = useState([])
  const showToast = useShowToast()

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()

      reader.onloadend = () => {
        setImgUrl(reader.result)
      }

      reader.readAsDataURL(file)
    } else {
      showToast('Invalid file type', ' Please select an image file', 'error')
      setImgUrl(null)
    }
  }

  const handleMultipleImagesChange = (files) => {
    const validFiles = Array.from(files).filter((file) => file && file.type.startsWith('image/'))

    if (validFiles.length !== files.length) {
      showToast('Invalid file type', 'Please select image files only', 'error')
    }

    const readers = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
    })

    Promise.all(readers).then((urls) => {
      setImgUrls((prev) => [...prev, ...urls])
    })
  }

  return {
    handleImageChange,
    handleMultipleImagesChange,
    imgUrl,
    setImgUrl,
    imgUrls,
    setImgUrls,
  }
}

export default usePreviewImg
