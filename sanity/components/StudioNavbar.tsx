import { Button, Flex } from '@sanity/ui'
import type { NavbarProps } from 'sanity'

export default function StudioNavbar(props: NavbarProps) {
  return (
    <Flex align="center" gap={2}>
      <div style={{ flex: 1 }}>{props.renderDefault(props)}</div>
      <Flex paddingRight={3}>
        <Button
          as="a"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          mode="ghost"
          tone="primary"
          text="View site ↗"
          fontSize={1}
        />
      </Flex>
    </Flex>
  )
}
