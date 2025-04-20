// 生成 base64 图片的函数
const generateTextImage = (text, width = 1200, height = 400) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = width
  canvas.height = height

  // 绘制背景
  ctx.fillStyle = '#00aeec'
  ctx.fillRect(0, 0, width, height)

  // 设置文字样式
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 60px "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 绘制文字
  ctx.fillText(text, width/2, height/2)

  return canvas.toDataURL()
}

// 使用示例
export const mockCarouselItems = [
  {
    id: 1,
    imageUrl: generateTextImage("活动一暂定"),
    altText: "轮播图1"
  },
  {
    id: 1,
    imageUrl: generateTextImage("活动二暂定"),
    altText: "轮播图2"
  },
  {
    id: 1,
    imageUrl: generateTextImage("活动三暂定"),
    altText: "轮播图3"
  },
  {
    id: 1,
    imageUrl: generateTextImage("活动四暂定"),
    altText: "轮播图4"
  },
  // 其他项同理...
]